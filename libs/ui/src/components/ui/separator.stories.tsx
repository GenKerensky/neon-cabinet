import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";
import { expect } from "storybook/test";

const meta = {
  component: Separator,
  title: "Separator",
} satisfies Meta<typeof Separator>;
export default meta;

type Story = StoryObj<typeof Separator>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Separator/gi)).toBeTruthy();
  },
};
