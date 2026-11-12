/** Temporary 4-digit order number, used until orders are really saved. */
export function makeTempOrderNumber(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}
