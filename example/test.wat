(module 
  (func $add (param $x i32) (param $y i32) (result i32)
    local.get $y
    local.get $x
    i32.add
  )

  (export "add" (func $add))
)
