import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectScrollUpButton } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectScrollUpButton,
  title: "SelectScrollUpButton",
} satisfies Meta<typeof SelectScrollUpButton>;
export default meta;

type Story = StoryObj<typeof SelectScrollUpButton>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectScrollUpButton/gi)).toBeTruthy();
  },
};
