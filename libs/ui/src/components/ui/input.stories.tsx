import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { expect } from "storybook/test";

const meta = {
  component: Input,
  title: "Input",
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof Input>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Input/gi)).toBeTruthy();
  },
};
