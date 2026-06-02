import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: Select,
  title: "Select",
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof Select>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Select/gi)).toBeTruthy();
  },
};
