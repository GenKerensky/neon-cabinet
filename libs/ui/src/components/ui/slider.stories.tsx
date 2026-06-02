import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";
import { expect } from "storybook/test";

const meta = {
  component: Slider,
  title: "Slider",
} satisfies Meta<typeof Slider>;
export default meta;

type Story = StoryObj<typeof Slider>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Slider/gi)).toBeTruthy();
  },
};
