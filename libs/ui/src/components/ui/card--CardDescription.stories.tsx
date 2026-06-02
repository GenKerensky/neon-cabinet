import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardDescription } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: CardDescription,
  title: "CardDescription",
} satisfies Meta<typeof CardDescription>;
export default meta;

type Story = StoryObj<typeof CardDescription>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CardDescription/gi)).toBeTruthy();
  },
};
