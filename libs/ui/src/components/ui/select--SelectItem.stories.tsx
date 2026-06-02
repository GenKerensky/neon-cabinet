import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectItem } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectItem,
  title: "SelectItem",
} satisfies Meta<typeof SelectItem>;
export default meta;

type Story = StoryObj<typeof SelectItem>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectItem/gi)).toBeTruthy();
  },
};
