import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { expect } from "storybook/test";

const meta = {
  component: Button,
  title: "Button",
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Button/gi)).toBeTruthy();
  },
};
