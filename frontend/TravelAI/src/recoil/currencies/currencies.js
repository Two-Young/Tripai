import {atom} from 'recoil';

const currenciesAtom = atom({
  key: 'currencies',
  default: [],
});

export default currenciesAtom;
