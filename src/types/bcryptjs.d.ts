declare module "bcryptjs" {
  export function compare(value: string, hash: string): Promise<boolean>;
  export function hash(value: string, saltOrRounds: string | number): Promise<string>;
  const bcrypt: { compare: typeof compare; hash: typeof hash };
  export default bcrypt;
}
