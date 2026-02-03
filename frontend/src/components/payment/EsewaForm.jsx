import React, { useEffect, useRef } from 'react';

const EsewaForm = ({ formData, formUrl }) => {
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <form ref={formRef} action={formUrl} method="POST" style={{ display: 'none' }}>
      {Object.entries(formData).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  );
};

export default EsewaForm;
