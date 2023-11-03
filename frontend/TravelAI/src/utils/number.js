export function formatCurrency(value) {
  if (!value) {
    return '0';
  }
  if (value >= 100) {
    return Math.round(value);
  }
  if (value >= 10) {
    return value.toFixed(2);
  }
  if (value >= 1) {
    return value.toFixed(3);
  }
  return value.toFixed(4);
}

// export const addComma = obj => {
//   if (!obj) {
//     return '';
//   }
//   if (typeof obj === 'number') {
//     obj = obj.toString();
//   }
//   const regx = new RegExp(/(-?\d+)(\d{3})/);
//   const bExists = obj.indexOf('.', 0);
//   const strArr = obj.split('.');
//   while (regx.test(strArr[0])) {
//     strArr[0] = strArr[0].replace(regx, '$1,$2');
//   }
//   if (bExists > -1) {
//     obj = strArr[0] + '.' + strArr[1];
//   } else {
//     obj = strArr[0];
//   }
//   return obj;
// };

export function formatWithCommas(value) {
  value = formatCurrency(value);
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
