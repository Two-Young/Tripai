import {atom} from 'recoil';

const countriesAtom = atom({
  key: 'countries',
  default: [],
});

export default countriesAtom;
