declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, any>,
    Record<string, any>,
    unknown
  >;
  export default component;
}
