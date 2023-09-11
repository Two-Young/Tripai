import metrics from './metrics';

const size = {
  font6: metrics.screenWidth * 0.035,
  font7: metrics.screenWidth * 0.04,
  font8: metrics.screenWidth * 0.045,
  font9: metrics.screenWidth * 0.05,
  font10: metrics.screenWidth * 0.055,
  font11: metrics.screenWidth * 0.06,
  font12: metrics.screenWidth * 0.065,
  font13: metrics.screenWidth * 0.07,
  font14: metrics.screenWidth * 0.075,
  font15: metrics.screenWidth * 0.08,
  font16: metrics.screenWidth * 0.085,
  font17: metrics.screenWidth * 0.09,
  font18: metrics.screenWidth * 0.095,
  font19: metrics.screenWidth * 0.1,
  font20: metrics.screenWidth * 0.105,
  font21: metrics.screenWidth * 0.11,
  font22: metrics.screenWidth * 0.115,
  font23: metrics.screenWidth * 0.12,
  font24: metrics.screenWidth * 0.125,
  font25: metrics.screenWidth * 0.13,
  font26: metrics.screenWidth * 0.135,
  font27: metrics.screenWidth * 0.14,
  font28: metrics.screenWidth * 0.145,
  font29: metrics.screenWidth * 0.15,
  font30: metrics.screenWidth * 0.155,
  font31: metrics.screenWidth * 0.16,
  font32: metrics.screenWidth * 0.165,
  font33: metrics.screenWidth * 0.17,
  font34: metrics.screenWidth * 0.175,
  font35: metrics.screenWidth * 0.18,
  font36: metrics.screenWidth * 0.185,
  font37: metrics.screenWidth * 0.19,
  font38: metrics.screenWidth * 0.195,
  font39: metrics.screenWidth * 0.2,
  font40: metrics.screenWidth * 0.205,
};

const weight = {
  light: '200',
  regular: '400',
  medium: '500',
  bold: '700',
  black: '900',
};

const type = {
  base: 'Roboto',
  bold: 'Roboto-Bold',
  emphasis: 'Helvetica-Oblique',
};

export const Light = (number, fontFamily = 'Poppins') => {
  return {
    fontFamily: `${fontFamily}-Light`,
    ...(number > 0 && {fontSize: number}),
    // ...(number > 0 && {lineHeight: number}),
  };
};

export const Regular = (number, fontFamily = 'Poppins') => {
  return {
    fontFamily: `${fontFamily}-Regular`,
    ...(number > 0 && {fontSize: number}),
    // ...(number > 0 && {lineHeight: number}),
  };
};

export const Medium = (number, fontFamily = 'Poppins') => {
  return {
    fontFamily: `${fontFamily}-Medium`,
    ...(number > 0 && {fontSize: number}),
    // ...(number > 0 && {lineHeight: number}),
  };
};

export const Bold = (number, fontFamily = 'Poppins') => {
  return {
    fontFamily: `${fontFamily}-Bold`,
    ...(number > 0 && {fontSize: number}),
    // ...(number > 0 && {lineHeight: number}),
  };
};

export const SemiBold = (number, fontFamily = 'Poppins') => {
  return {
    fontFamily: `${fontFamily}-SemiBold`,
    ...(number > 0 && {fontSize: number}),
    // ...(number > 0 && {lineHeight: number}),
  };
};

export default {size, weight, type};
