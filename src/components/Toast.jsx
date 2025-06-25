import { createPortal } from 'react-dom';

function Toast({ message }) {
  return createPortal(
    <div className="notification-toast">
      <p>{message}</p>
    </div>,
    document.body
  );
}

export default Toast;
