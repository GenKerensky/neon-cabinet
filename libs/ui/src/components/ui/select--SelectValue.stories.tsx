import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectValue } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectValue,
  title: "SelectValue",
} satisfies Meta<typeof SelectValue>;
export default meta;

type Story = StoryObj<typeof SelectValue>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectValue/gi)).toBeTruthy();
  },
};
