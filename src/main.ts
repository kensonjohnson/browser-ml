import "./style.css";
import { fixGHPagesUrls } from "../utils/gh-pages-urls";

if (!import.meta.env.DEV) {
  fixGHPagesUrls();
}
