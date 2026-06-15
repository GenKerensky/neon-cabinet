import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectTrigger } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectTrigger,
  title: "SelectTrigger",
} satisfies Meta<typeof SelectTrigger>;
export default meta;

type Story = StoryObj<typeof SelectTrigger>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectTrigger/gi)).toBeTruthy();
  },
};
