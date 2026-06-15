import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollapsibleContent } from "./collapsible";
import { expect } from "storybook/test";

const meta = {
  component: CollapsibleContent,
  title: "CollapsibleContent",
} satisfies Meta<typeof CollapsibleContent>;
export default meta;

type Story = StoryObj<typeof CollapsibleContent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CollapsibleContent/gi)).toBeTruthy();
  },
};
