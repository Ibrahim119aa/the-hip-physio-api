import DOMPurify from 'dompurify';
import { JSDOM } from "jsdom";

const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

export default domPurify;