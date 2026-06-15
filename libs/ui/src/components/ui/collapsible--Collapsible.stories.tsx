import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible } from "./collapsible";
import { expect } from "storybook/test";

const meta = {
  component: Collapsible,
  title: "Collapsible",
} satisfies Meta<typeof Collapsible>;
export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Collapsible/gi)).toBeTruthy();
  },
};
