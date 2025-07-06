import React from "react";

function XmlHierarchy({ data }) {
  if (!data) return null;

  return (
    <ul>
      <li>
        <strong>{data.tag}</strong>
        {Object.keys(data.attributes).length > 0 && (
          <ul>
            {Object.entries(data.attributes).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        )}
        {data.text && <p>{data.text}</p>}
        {data.children.length > 0 && (
          <ul>
            {data.children.map((child, index) => (
              <XmlHierarchy key={index} data={child} />
            ))}
          </ul>
        )}
      </li>
    </ul>
  );
}

function MessageBody({ messageBody }) {
  if (!messageBody) return <p>No message content available.</p>;

  let parsedBody = null;
  let parseError = false;

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(messageBody, "application/xml");

    const parseErrorNode = xmlDoc.querySelector("parsererror");
    if (parseErrorNode) {
      throw new Error("Invalid XML format");
    }

    parsedBody = {
      tag: xmlDoc.documentElement.nodeName,
      attributes: Array.from(xmlDoc.documentElement.attributes).reduce(
        (acc, attr) => ({ ...acc, [attr.name]: attr.value }),
        {}
      ),
      text: xmlDoc.documentElement.textContent.trim(),
      children: Array.from(xmlDoc.documentElement.children).map((child) => ({
        tag: child.nodeName,
        attributes: Array.from(child.attributes).reduce(
          (acc, attr) => ({ ...acc, [attr.name]: attr.value }),
          {}
        ),
        text: child.textContent.trim(),
        children: [],
      })),
    };
  } catch (e) {
    console.error("Error parsing XML:", e);
    parseError = true;
  }

  return (
    <div>
      <h3>Message Body</h3>
      {parseError ? (
        <>
          <p style={{ color: "red" }}>XML parsing error. Displaying raw XML:</p>
          <pre>{messageBody}</pre>
        </>
      ) : (
        <>
          <p style={{ color: "green" }}>Valid XML:</p>
          <pre>{messageBody}</pre>
        </>
      )}
    </div>
  );
}

export default MessageBody;