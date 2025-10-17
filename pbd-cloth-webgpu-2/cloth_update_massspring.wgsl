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

  let stiffness = 0.1;
  for (var i: i32 = 0; i < 4; i++) {
    let offsets = array<vec2<i32>, 4>(vec2<i32>(1,0), vec2<i32>(-1,0), vec2<i32>(0,1), vec2<i32>(0,-1));
    let nx = i32(idx % size) + offsets[i].x;
    let ny = i32(idx / size) + offsets[i].y;
    if (nx >= 0 && ny >= 0 && nx < i32(size) && ny < i32(size)) {
      let nidx = u32(ny) * size + u32(nx);
      let neighbor = inPositions[nidx].xyz;
      let dir = neighbor - newPos;
      let dist = length(dir);
      let rest = params.spacing;
      if (dist > 0.0) {
        newPos += (dir / dist) * (dist - rest) * stiffness;
      }
    }
  }
  outPositions[idx] = vec4<f32>(newPos, pos.w);
}
