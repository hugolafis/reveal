/*!
 * Copyright 2022 Cognite AS
 */

use wasm_bindgen::prelude::*;
use web_sys::console;
extern crate console_error_panic_hook;

use std::vec::Vec;
use serde::Deserialize;
use std::fmt::Display;

mod point_octree;
mod shapes;
mod linalg;
mod parse_inputs;
mod bvh;

use linalg::{Vec3WithIndex,BoundingBox,Vec3,to_bounding_box};

#[derive(Deserialize)]
pub struct InputBoundingBox {
    min: [f64; 3],
    max: [f64; 3]
}

#[derive(Debug,Deserialize)]
struct InputCylinder {
    center_a: [f64; 3],
    center_b: [f64; 3],
    radius: f64
}

#[derive(Debug,Deserialize)]
struct InputOrientedBox {
    inv_instance_matrix: [f64; 16]
}

#[wasm_bindgen]
#[derive(Debug,Deserialize)]
pub struct InputShape {
    object_id: u32,
    cylinder: Option<Box<InputCylinder>>,
    oriented_box: Option<Box<InputOrientedBox>>
}

fn init() -> () {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn assign_points(input_shapes: js_sys::Array,
                     points: js_sys::Float32Array,
                     input_bounding_box: js_sys::Object,
                     input_point_offset: js_sys::Array) -> js_sys::Uint16Array {
    init();

    let point_offset = Vec3::new(input_point_offset.get(0).as_f64().unwrap(),
                                 input_point_offset.get(1).as_f64().unwrap(),
                                 input_point_offset.get(2).as_f64().unwrap());
    let point_vec = parse_inputs::parse_points(&points, point_offset);

    let bounding_box = to_bounding_box(&input_bounding_box.into_serde::<InputBoundingBox>().unwrap());


    /* console::time();
    let octree = point_octree::PointOctree::new(point_vec, bounding_box);
    console::time_end(); */

    let mut input_shape_vec: Vec<InputShape> =
        Vec::<InputShape>::with_capacity(input_shapes.length() as usize);

    for value in input_shapes.iter() {
        assert!(value.is_object());

        let input_shape = value.into_serde::<InputShape>().unwrap();
        input_shape_vec.push(input_shape);
    }

    let shape_vec = parse_inputs::parse_objects(input_shape_vec);

    let shapes_with_boxes = shape_vec.into_iter().map(|shape| (shape.create_bounding_box(), shape)).collect();
    let bounding_volume_hierarchy = bvh::BoundingVolumeHierarchy::new(shapes_with_boxes);

    let object_ids = js_sys::Uint16Array::new_with_length(points.length() / 3);

    for i in 0..point_vec.len() {
        let id = bounding_volume_hierarchy.get_object_id(&point_vec[i].vec);
        object_ids.set_index(i as u32, id as u16);
    }

    /* let object_ids = js_sys::Uint16Array::new_with_length(points.length() / 3).fill(0, 0, points.length() / 3);
    console::log_1(&JsValue::from_str("Done constructing tree and parsing, running search now"));

    console::time();
    for shape in shape_vec.iter() {
        let points_in_box = octree.get_points_in_box(&shape.create_bounding_box());
        for point in points_in_box {
            if shape.contains_point(&point.vec) {
                object_ids.set_index(point.index, shape.get_object_id() as u16);
            }
        }
    }
    console::time_end(); */

    object_ids
}
