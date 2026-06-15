import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardHeader } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: CardHeader,
  title: "CardHeader",
} satisfies Meta<typeof CardHeader>;
export default meta;

type Story = StoryObj<typeof CardHeader>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CardHeader/gi)).toBeTruthy();
  },
};
