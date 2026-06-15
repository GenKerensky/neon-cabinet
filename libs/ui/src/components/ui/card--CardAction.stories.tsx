import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardAction } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: CardAction,
  title: "CardAction",
} satisfies Meta<typeof CardAction>;
export default meta;

type Story = StoryObj<typeof CardAction>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CardAction/gi)).toBeTruthy();
  },
};
