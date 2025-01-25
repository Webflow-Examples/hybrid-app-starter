import { ElementMapping } from "../types/element-mapping";

export function useElementMapper() {
  const mapElement = async (element: AnyElement): Promise<ElementMapping> => {
    // Get element styles array
    const stylesArray = element.styles ? await element.getStyles() : [];
    const styles = await mapElementStyles(element, stylesArray);

    // Get element attributes
    const attributes = element.customAttributes
      ? await element.getAllCustomAttributes()
      : {};

    // Get element-specific settings
    const settings = await getElementSettings(element);

    // Get and map children recursively
    const children = await mapChildren(element);

    return {
      id: element.id,
      type: element.type,
      styles,
      attributes,
      settings,
      children,
    };
  };

  const mapElementStyles = async (
    element: AnyElement,
    stylesArray: Style[]
  ): Promise<StyleMapping[]> => {
    if (!stylesArray?.length) return [];

    return Promise.all(
      stylesArray.map(async (style) => {
        const properties: StyleMapping["properties"] = {};
        const breakpoints: BreakpointId[] = ["main", "medium", "small", "tiny"];
        const pseudoStates: PseudoStateKey[] = ["noPseudo", "hover", "focus"];

        for (const breakpoint of breakpoints) {
          properties[breakpoint] = properties[breakpoint] || {};
          for (const pseudo of pseudoStates) {
            const props = await style.getProperties({ breakpoint, pseudo });
            if (Object.keys(props).length > 0) {
              properties[breakpoint][pseudo] = props;
            }
          }
        }

        return {
          id: style.id,
          name: await style.getName(),
          properties,
        };
      })
    );
  };

  const mapChildren = async (
    element: AnyElement
  ): Promise<ElementMapping[]> => {
    if (!element.children) return [];
    const children = await element.getChildren();
    return Promise.all(children.map((child) => mapElement(child)));
  };

  const getElementSettings = async (element: AnyElement) => {
    // Handle element-specific settings based on type
    switch (element.type) {
      case "Link":
        return {
          linkSettings: {
            target: await (element as LinkElement).getTarget(),
          },
        };
      // Add other element types as needed
      default:
        return undefined;
    }
  };

  return { mapElement };
}
