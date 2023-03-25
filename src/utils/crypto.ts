import { scrypt } from "crypto";

export const ascrypt = (
  password: string,
  salt: string,
  n: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, n, (err, derivedKey) => {
      if (err) reject(err);

      resolve(derivedKey.toString("base64"));
    });
  });
};
