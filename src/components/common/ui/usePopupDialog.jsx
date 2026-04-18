import { useRef, useState } from "react";

export function usePopupDialog() {
  const resolverRef = useRef(null);
  const [state, setState] = useState({
    isOpen: false,
    type: "alert",
    title: "Thông báo",
    message: "",
    okText: "OK",
    cancelText: "Huy",
    inputValue: "",
    placeholder: "",
  });

  function resolveAndClose(value) {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState((currentState) => ({ ...currentState, isOpen: false }));
    if (resolver) {
      resolver(value);
    }
  }

  function popupAlert(message, options = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        type: "alert",
        title: options.title || "Thông báo",
        message,
        okText: options.okText || "Đóng",
        cancelText: "Hủy",
        inputValue: "",
        placeholder: "",
      });
    });
  }

  function popupConfirm(message, options = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        type: "confirm",
        title: options.title || "Xác nhận",
        message,
        okText: options.okText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
        inputValue: "",
        placeholder: "",
      });
    });
  }

  function popupPrompt(message, defaultValue = "", options = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        type: "prompt",
        title: options.title || "Nhập thông tin",
        message,
        okText: options.okText || "Lưu",
        cancelText: options.cancelText || "Hủy",
        inputValue: defaultValue,
        placeholder: options.placeholder || "",
      });
    });
  }

  function setInputValue(value) {
    setState((currentState) => ({ ...currentState, inputValue: value }));
  }

  const popupElement = state.isOpen ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">{state.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{state.message}</p>

        {state.type === "prompt" ? (
          <input
            autoFocus
            value={state.inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={state.placeholder}
            className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          {state.type !== "alert" ? (
            <button
              type="button"
              onClick={() => resolveAndClose(state.type === "prompt" ? null : false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              {state.cancelText}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => resolveAndClose(state.type === "prompt" ? state.inputValue : true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {state.okText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return {
    popupAlert,
    popupConfirm,
    popupPrompt,
    popupElement,
  };
}
