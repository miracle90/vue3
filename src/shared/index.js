export const isObject = (val) => typeof val === "object" && val !== null;
export const isSymbol = (val) => typeof val === "symbol";
export const isArray = Array.isArray;
export const isInteger = (key) => "" + parseInt(key, 10) === key;

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val, key) => hasOwnProperty.call(val, key);

export const hasChanged = (value, oldValue) => value !== oldValue;
