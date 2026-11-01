# @moonwitness/ui

Standalone React design system and application-template starter for MoonWitness. It provides the shared HUD-inspired visual language, reusable controls, composition blocks, and page templates; consuming apps do not need to adopt Next.js.

## Install

```json
{
  "dependencies": {
    "@moonwitness/ui": "workspace:*"
  }
}
```

Import the stylesheet once from the application entry point:

```css
@import "@moonwitness/ui/styles.css";
```

## Layers

- `raw/`: semantic, unstyled primitives.
- `atoms/`: accessible, styled controls.
- `components/`: reusable compositions such as cards.
- `blocks/`: common interaction patterns, such as labeled form fields.
- `templates/`: responsive page structure, including centered auth and workspace layouts.

Import public components from the package root:

```tsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
} from "@moonwitness/ui";

export function Example() {
  return (
    <Card>
      <CardContent>
        <FormField label="Search" htmlFor="search">
          <Input id="search" placeholder="Search..." />
        </FormField>
        <Badge variant="live">Connected</Badge>
        <Button>Run</Button>
      </CardContent>
    </Card>
  );
}
```

The package exports its design-system CSS and does not require Tailwind at runtime. App-specific state and domain behavior should stay in the consuming app; shared visual primitives and layouts belong here.
