import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardTitle } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: CardTitle,
  title: "CardTitle",
} satisfies Meta<typeof CardTitle>;
export default meta;

type Story = StoryObj<typeof CardTitle>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CardTitle/gi)).toBeTruthy();
  },
};
