import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const POPUP_MESSAGE_MAPPINGS = [
  {
    match: "invalid order status update",
    message: "Không thể cập nhật trạng thái đơn vì thao tác chuyển trạng thái không hợp lệ.",
  },
  {
    match: "invalid shipping status update",
    message: "Không thể cập nhật trạng thái vận chuyển vì thao tác chuyển trạng thái không hợp lệ.",
  },
];

function normalizePopupMessage(message) {
  if (typeof message !== "string") {
    return message;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  const mapped = POPUP_MESSAGE_MAPPINGS.find((item) => normalized.includes(item.match));
  return mapped?.message ?? trimmed;
}

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

function StyledSelectField({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0] ?? null;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >
        {selectedOption ? (
          selectedOption.className ? (
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${selectedOption.className}`}>
              {selectedOption.label}
            </span>
          ) : (
            <span>{selectedOption.label}</span>
          )
        ) : (
          <span>-</span>
        )}
        <span className="text-slate-500">{isOpen ? "▴" : "▾"}</span>
      </button>

      {isOpen ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg">
          {options.map((option) => {
            const isActive = option.value === selectedOption?.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-4 py-2.5 text-left transition ${
                  isActive ? "bg-orange-50" : "hover:bg-slate-50"
                }`}
              >
                {option.className ? (
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${option.className}`}>
                    {option.label}
                  </span>
                ) : (
                  <span className="text-sm text-slate-700">{option.label}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
        message: normalizePopupMessage(message),
        okText: options.okText || "Đã hiểu",
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

      if (field.required && isEmptyValue(field, value)) {
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

  function closePopupFromHeader() {
    if (state.type === "confirm") {
      resolveAndClose(false);
      return;
    }

    if (state.type === "prompt" || state.type === "form") {
      resolveAndClose(null);
      return;
    }

    resolveAndClose(true);
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
      const options = field.options ?? [];
      const hasStyledOptions = options.some((option) => typeof option.className === "string" && option.className.trim().length > 0);

      if (hasStyledOptions) {
        return (
          <StyledSelectField
            value={value}
            options={options}
            onChange={(nextValue) => setFormValue(field.name, nextValue)}
          />
        );
      }

      return (
        <select
          value={value}
          onChange={(event) => setFormValue(field.name, event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        >
          {options.map((option) => (
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

  const isAlertDialog = state.type === "alert";
  const dialogWidthClass = state.type === "form" ? "max-w-xl" : isAlertDialog ? "max-w-md" : "max-w-lg";

  const popupElement = state.isOpen ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div
        className={`relative w-full ${dialogWidthClass} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] border border-orange-200 bg-white ${isAlertDialog ? "p-5" : "p-6"} shadow-[0_24px_60px_rgba(15,23,42,0.24)]`}
      >
        <button
          type="button"
          onClick={closePopupFromHeader}
          className={`absolute rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 ${isAlertDialog ? "right-4 top-4" : "right-8 top-8"}`}
          aria-label="Đóng modal"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-3">
          {isAlertDialog ? (
            <div className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className={`${isAlertDialog ? "text-xl" : "text-2xl"} font-bold text-[#11284b]`}>{state.title}</h3>
            {state.message ? (
              <p
                className={`mt-2 whitespace-pre-line text-sm ${
                  isAlertDialog
                    ? "rounded-xl border border-orange-100 bg-[#fff8ef] px-3 py-2 text-[#334a6b] leading-6"
                    : "text-slate-600"
                }`}
              >
                {state.message}
              </p>
            ) : null}
          </div>
        </div>

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
              <button
                type="submit"
                className="rounded-xl bg-[#172033] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(23,32,51,0.2)]"
              >
                {state.okText}
              </button>
            </div>
          </form>
        ) : (
          <div className={`${isAlertDialog ? "mt-4" : "mt-5"} flex justify-end gap-2`}>
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
              className={`rounded-xl ${isAlertDialog ? "px-5 py-2.5" : "px-4 py-2"} text-sm font-semibold text-white shadow-[0_8px_16px_rgba(15,23,42,0.2)] ${
                isAlertDialog ? "bg-orange-500 hover:bg-orange-600" : "bg-[#172033] hover:bg-[#0f172a]"
              }`}
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
