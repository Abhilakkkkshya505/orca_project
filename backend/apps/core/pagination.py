from rest_framework.pagination import PageNumberPagination


class StandardPageNumberPagination(PageNumberPagination):
    """
    Standard pagination for ORCA list endpoints:
    Default page size 25, maximum 100, page_size param allowed.
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
