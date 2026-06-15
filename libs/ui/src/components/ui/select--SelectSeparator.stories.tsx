import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectSeparator } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectSeparator,
  title: "SelectSeparator",
} satisfies Meta<typeof SelectSeparator>;
export default meta;

type Story = StoryObj<typeof SelectSeparator>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectSeparator/gi)).toBeTruthy();
  },
};
