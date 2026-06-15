import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectScrollDownButton } from "./select";
import { expect } from "storybook/test";

const meta = {
  component: SelectScrollDownButton,
  title: "SelectScrollDownButton",
} satisfies Meta<typeof SelectScrollDownButton>;
export default meta;

type Story = StoryObj<typeof SelectScrollDownButton>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/SelectScrollDownButton/gi)).toBeTruthy();
  },
};
