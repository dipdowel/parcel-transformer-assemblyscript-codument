export function debugOnlyHelper(): void {
  console.log(
    ">>> debugOnlyHelper() won't be imported into a production build!",
  );
}
