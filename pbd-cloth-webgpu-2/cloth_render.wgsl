struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@vertex
fn vs_main(@location(0) inPos: vec3<f32>, @location(1) fixed: f32) -> VSOut {
  var out: VSOut;
  out.pos = vec4<f32>(inPos.x, inPos.y, inPos.z, 1.0);
  out.color = mix(vec3<f32>(0.4, 0.6, 1.0), vec3<f32>(1.0, 0.2, 0.2), fixed);
  return out;
}

@fragment
fn fs_main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
