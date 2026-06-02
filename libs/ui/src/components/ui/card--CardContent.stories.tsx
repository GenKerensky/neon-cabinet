import type { Meta, StoryObj } from "@storybook/react-vite";
import { CardContent } from "./card";
import { expect } from "storybook/test";

const meta = {
  component: CardContent,
  title: "CardContent",
} satisfies Meta<typeof CardContent>;
export default meta;

type Story = StoryObj<typeof CardContent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/CardContent/gi)).toBeTruthy();
  },
};
