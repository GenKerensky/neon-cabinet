import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardFooter } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: CardFooter,
  title: "CardFooter",
} satisfies Meta<typeof CardFooter>;
export default meta;

type Story = StoryObj<typeof CardFooter>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CardFooter/gi)).toBeTruthy();
  },
};
