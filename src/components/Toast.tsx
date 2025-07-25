// lightweight toast built with a Headless-UI Dialog
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function Toast({
  open,
  onClose,
  msg,
}: {
  open: boolean;
  onClose: () => void;
  msg: string;
}) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="absolute inset-0 pointer-events-none flex items-start justify-center mt-4">
          <Transition.Child
            as={Fragment}
            enter="transition transform ease-out duration-150"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition transform ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <div className="px-4 py-2 rounded-lg bg-black/90 text-white text-sm shadow-lg pointer-events-auto">
              {msg}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
