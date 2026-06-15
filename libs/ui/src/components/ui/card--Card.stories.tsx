import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: Card,
  title: "Card",
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof Card>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Card/gi)).toBeTruthy();
  },
};
