import { useRef, useState } from "react";

const DEFAULT_STATE = {
  isOpen: false,
  type: "alert",
  title: "Thông báo",
  message: "",
  okText: "OK",
  cancelText: "Hủy",
  inputValue: "",
  placeholder: "",
  fields: [],
  formValues: {},
  formError: "",
};

function buildInitialFormValues(fields, initialValues = {}) {
  return fields.reduce((result, field) => {
    const fallbackValue = field.type === "checkbox" ? false : "";
    result[field.name] = initialValues[field.name] ?? field.defaultValue ?? fallbackValue;
    return result;
  }, {});
}

function isEmptyValue(field, value) {
  if (field.type === "checkbox") {
    return field.required ? value !== true : false;
  }

  if (value == null) {
    return true;
  }

  return String(value).trim().length === 0;
}

export function usePopupDialog() {
  const resolverRef = useRef(null);
  const [state, setState] = useState(DEFAULT_STATE);

  function resolveAndClose(value) {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState(DEFAULT_STATE);

    if (resolver) {
      resolver(value);
    }
  }

  function popupAlert(message, options = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        ...DEFAULT_STATE,
        isOpen: true,
        type: "alert",
        title: options.title || "Thông báo",
        message,
        okText: options.okText || "Đóng",
      });
    });
  }

  function popupConfirm(message, options = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        ...DEFAULT_STATE,
        isOpen: true,
        type: "confirm",
        title: options.title || "Xác nhận",
        message,
        okText: options.okText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
      });
    });
  }

  function popupPrompt(message, defaultValue = "", options = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        ...DEFAULT_STATE,
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

  function popupForm(options = {}) {
    return new Promise((resolve) => {
      const fields = options.fields ?? [];
      resolverRef.current = resolve;
      setState({
        ...DEFAULT_STATE,
        isOpen: true,
        type: "form",
        title: options.title || "Cập nhật thông tin",
        message: options.message || "",
        okText: options.okText || "Lưu",
        cancelText: options.cancelText || "Hủy",
        fields,
        formValues: buildInitialFormValues(fields, options.initialValues),
      });
    });
  }

  function setInputValue(value) {
    setState((currentState) => ({ ...currentState, inputValue: value }));
  }

  function setFormValue(name, value) {
    setState((currentState) => ({
      ...currentState,
      formValues: {
        ...currentState.formValues,
        [name]: value,
      },
      formError: "",
    }));
  }

  function submitForm() {
    for (const field of state.fields) {
      const value = state.formValues[field.name];

      if (isEmptyValue(field, value)) {
        setState((currentState) => ({
          ...currentState,
          formError: field.validationMessage || `${field.label || field.name} là bắt buộc.`,
        }));
        return;
      }

      if (typeof field.validate === "function") {
        const errorMessage = field.validate(value, state.formValues);
        if (errorMessage) {
          setState((currentState) => ({
            ...currentState,
            formError: errorMessage,
          }));
          return;
        }
      }
    }

    resolveAndClose(state.formValues);
  }

  function renderField(field) {
    const value = state.formValues[field.name];

    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(event) => setFormValue(field.name, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
          className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          value={value}
          onChange={(event) => setFormValue(field.name, event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => setFormValue(field.name, event.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-slate-700">{field.description || field.label}</span>
        </label>
      );
    }

    return (
      <input
        type={field.type || "text"}
        value={value}
        onChange={(event) => setFormValue(field.name, event.target.value)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
        className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    );
  }

  const popupElement = state.isOpen ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-[1.5rem] border border-orange-200 bg-white p-6 shadow-2xl">
        <h3 className="text-2xl font-bold text-[#11284b]">{state.title}</h3>
        {state.message ? <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{state.message}</p> : null}

        {state.type === "prompt" ? (
          <input
            autoFocus
            value={state.inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={state.placeholder}
            className="mt-5 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
        ) : null}

        {state.type === "form" ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitForm();
            }}
          >
            {state.fields.map((field) => (
              <div key={field.name}>
                {field.type === "checkbox" ? null : (
                  <label className="text-sm font-semibold text-[#11284b]">
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                  </label>
                )}
                {renderField(field)}
                {field.helpText ? <p className="mt-1 text-xs text-slate-500">{field.helpText}</p> : null}
              </div>
            ))}

            {state.formError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {state.formError}
              </p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => resolveAndClose(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {state.cancelText}
              </button>
              <button type="submit" className="rounded-xl bg-[#172033] px-4 py-2 text-sm font-semibold text-white">
                {state.okText}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 flex justify-end gap-2">
            {state.type !== "alert" ? (
              <button
                type="button"
                onClick={() => resolveAndClose(state.type === "prompt" ? null : false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {state.cancelText}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => resolveAndClose(state.type === "prompt" ? state.inputValue : true)}
              className="rounded-xl bg-[#172033] px-4 py-2 text-sm font-semibold text-white"
            >
              {state.okText}
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return {
    popupAlert,
    popupConfirm,
    popupPrompt,
    popupForm,
    popupElement,
  };
}
