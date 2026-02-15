import { photography } from "../lib/photography";
import GalleryClient from "./GalleryClient";

export default function Page() {
  return <GalleryClient photography={photography} />;
}
