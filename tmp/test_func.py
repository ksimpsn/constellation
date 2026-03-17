def main(row):
    """
    Example compute function.

    If CSV:
        row will be a dict like:
        {"value": "2"}

    If JSON:
        row will already be dict/object.
    """

    # Convert string → int if needed
    value = int(row["value"])

    # Example computation
    return value * value