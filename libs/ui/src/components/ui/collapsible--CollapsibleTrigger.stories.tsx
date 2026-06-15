import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollapsibleTrigger } from "./collapsible";
import { expect } from "storybook/test";

const meta = {
  component: CollapsibleTrigger,
  title: "CollapsibleTrigger",
} satisfies Meta<typeof CollapsibleTrigger>;
export default meta;

type Story = StoryObj<typeof CollapsibleTrigger>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CollapsibleTrigger/gi)).toBeTruthy();
  },
};
