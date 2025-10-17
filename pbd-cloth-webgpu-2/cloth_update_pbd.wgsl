struct Params {
  time: f32,
  gravityEnabled: f32,
  clothSize: f32,
  spacing: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> inPositions: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> outPositions: array<vec4<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let idx = id.x;
  let size = u32(params.clothSize);
  if (idx >= size * size) { return; }
  let pos = inPositions[idx];
  var newPos = pos.xyz;
  if (pos.w > 0.5) { outPositions[idx] = pos; return; }
  if (params.gravityEnabled > 0.5) { newPos.y -= 0.001; }
  var avg = vec3<f32>(0.0);
  var count = 0.0;
  for (var dy: i32 = -1; dy <= 1; dy++) {
    for (var dx: i32 = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) { continue; }
      let nx = i32(idx % size) + dx;
      let ny = i32(idx / size) + dy;
      if (nx >= 0 && ny >= 0 && nx < i32(size) && ny < i32(size)) {
        let nidx = u32(ny) * size + u32(nx);
        avg += inPositions[nidx].xyz;
        count += 1.0;
      }
    }
  }
  if (count > 0.0) { avg /= count; newPos += (avg - newPos) * 0.05; }
  outPositions[idx] = vec4<f32>(newPos, pos.w);
}
