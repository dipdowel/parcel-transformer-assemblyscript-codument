export function helper(): i32[] {
  //#dbg-start
  let a = 3;
  a = 2 + 4;
  console.log(
    ">>> Hi from the helper! You'll see this only in debug build! " +
      a.toString(10),
  );
  //#dbg-end

  return [2, 3, 4, 5];
}
