declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          cancel(): void;
          initialize(options: GoogleIdInitializeConfig): void;
          prompt(momentListener?: (notification: unknown) => void): void;
          renderButton(parent: HTMLElement, options: GoogleIdButtonConfiguration): void;
        };
      };
    };
  }

  interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
  }

  interface GoogleIdInitializeConfig {
    callback: (response: GoogleCredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
    client_id: string;
    ux_mode?: "popup" | "redirect";
  }

  interface GoogleIdButtonConfiguration {
    locale?: string;
    logo_alignment?: "center" | "left";
    shape?: "circle" | "pill" | "rectangular" | "square";
    size?: "large" | "medium" | "small";
    text?: "continue_with" | "signin" | "signin_with" | "signup_with";
    theme?: "filled_black" | "filled_blue" | "outline";
    width?: number | string;
  }
}

export {};
